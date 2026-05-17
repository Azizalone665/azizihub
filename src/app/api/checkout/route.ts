import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ---------- Email (optional) ----------
let transporter: any = null;
try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
} catch (e) { /* ignore */ }

async function sendEmail(order: any, shippingAddress: any) {
  if (!transporter) return;
  const itemsHtml = order.order_items.map((item: any) => `
    <tr>
      <td>${item.product_name}</td>
      <td>${item.quantity}</td>
      <td>₨${item.price.toLocaleString()}</td>
      <td>₨${item.total.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <h2>✨ New Order #${order.order_number}</h2>
    <p><strong>Customer:</strong> ${shippingAddress.fullName}</p>
    <p><strong>Phone:</strong> ${shippingAddress.phone}</p>
    <p><strong>Address:</strong> ${shippingAddress.addressLine1}, ${shippingAddress.city}</p>
    <h3>Items:</h3>
    <table border="1" cellpadding="5">${itemsHtml}</table>
    <p><strong>Total:</strong> ₨${order.total_amount.toLocaleString()}</p>
    <p><strong>Payment Method:</strong> ${order.payment_method}</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL || 'contactus@azizihub.com',
    subject: `📦 New Order #${order.order_number}`,
    html,
  });
}

// ---------- Main Checkout API ----------
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shippingAddress, paymentMethod } = await request.json();

  // Get cart
  const { data: cart } = await supabase
    .from('cart')
    .select(`id, cart_items ( *, products (*) )`)
    .eq('user_id', user.id)
    .single();

  if (!cart?.cart_items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  let subtotal = 0;
  const orderItems = cart.cart_items.map((item: any) => {
    const total = item.price * item.quantity;
    subtotal += total;
    return {
      product_id: item.product_id,
      product_name: item.products.name,
      product_image: item.products.attributes?.main_image,
      quantity: item.quantity,
      price: item.price,
      total,
    };
  });

  const shippingAmount = subtotal > 5000 ? 0 : 200;
  const taxAmount = subtotal * 0.05;
  const totalAmount = subtotal + shippingAmount + taxAmount;
  const orderNumber = `AZH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      total_amount: totalAmount,
      subtotal,
      discount_amount: 0,
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Create order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item: any) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Clear cart
  await supabase.from('cart_items').delete().eq('cart_id', cart.id);

  // Send email notification (optional)
  try {
    await sendEmail({ ...order, order_items: orderItems }, shippingAddress);
  } catch (err) {
    console.error('Email send failed:', err);
  }

  return NextResponse.json({ order, orderNumber, totalAmount });
}