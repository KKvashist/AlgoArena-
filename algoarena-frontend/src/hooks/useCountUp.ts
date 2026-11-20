import { useEffect, useState } from 'react'

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null

    function step(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }

    const frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export default useCountUp
