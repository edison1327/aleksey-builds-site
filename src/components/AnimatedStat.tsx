import { useCountUp } from "@/hooks/useCountUp";

interface AnimatedStatProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  delay?: number;
  className?: string;
}

const AnimatedStat = ({ 
  value, 
  suffix = "", 
  prefix = "",
  duration = 2000, 
  delay = 0,
  className = ""
}: AnimatedStatProps) => {
  const { count, ref } = useCountUp({ end: value, duration, delay, suffix });

  return (
    <div ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
};

export default AnimatedStat;
