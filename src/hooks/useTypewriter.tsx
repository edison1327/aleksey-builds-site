import { useState, useEffect } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
  loopDelay?: number;
}

export const useTypewriter = ({
  text,
  speed = 80,
  delay = 0,
  loop = false,
  loopDelay = 2000,
}: UseTypewriterOptions) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    const startTyping = () => {
      setIsTyping(true);
      setIsComplete(false);
      setDisplayText("");
      charIndex = 0;

      const typeChar = () => {
        if (charIndex < text.length) {
          setDisplayText(text.slice(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(typeChar, speed);
        } else {
          setIsTyping(false);
          setIsComplete(true);
          
          if (loop) {
            timeout = setTimeout(() => {
              startTyping();
            }, loopDelay);
          }
        }
      };

      timeout = setTimeout(typeChar, delay);
    };

    startTyping();

    return () => clearTimeout(timeout);
  }, [text, speed, delay, loop, loopDelay]);

  return { displayText, isTyping, isComplete };
};
