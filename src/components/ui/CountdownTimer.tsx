'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface CountdownTimerProps {
  targetDate: Date
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ]

  return (
    <div className="flex space-x-2">
      {timeUnits.map((unit) => (
        <div key={unit.label} className="text-center">
          <motion.div
            key={unit.value}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg shadow-md px-3 py-2 min-w-[60px]"
          >
            <div className="text-2xl font-bold text-primary-600">
              {unit.value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500">{unit.label}</div>
          </motion.div>
        </div>
      ))}
    </div>
  )
}