import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Minimize2, Maximize2, Clock } from 'lucide-react';

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isMinimized, setIsMinimized] = useState(localStorage.getItem('isMinimized') === 'true');
    
    const targetDate = useMemo(() => new Date('December 14, 2024 00:00:00'), []);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetDate.getTime() - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000)
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        localStorage.setItem('isMinimized', !isMinimized);
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <Card className={`bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 ${
                isMinimized ? 'w-12 h-12' : 'w-64 p-4'
            }`}>
                <div className="flex items-center justify-between">
                    {!isMinimized ? (
                        <div>
                            <h3 className="text-sm font-semibold mb-2">
                                Time Until Presentation (Dec 14, 2024)
                            </h3>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <div className="text-lg font-bold">{timeLeft.days}</div>
                                    <div className="text-xs text-gray-500">Days</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{timeLeft.hours}</div>
                                    <div className="text-xs text-gray-500">Hours</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{timeLeft.minutes}</div>
                                    <div className="text-xs text-gray-500">Mins</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{timeLeft.seconds}</div>
                                    <div className="text-xs text-gray-500">Secs</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Clock className="h-4 w-4 text-gray-500 ml-1" />
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`ml-auto ${isMinimized ? 'w-6 h-6' : ''}`}
                        onClick={toggleMinimize}
                    >
                        {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
