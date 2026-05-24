import { useState } from 'react';

export const useTimer = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate1, setEventDate1] = useState('');
  const [eventDate2, setEventDate2] = useState('');
  const [timeDifference, setTimeDifference] = useState<string | null>(null);

  const calculateTimeDifference = () => {
    if (!eventDate1 || !eventDate2) return;
    
    const date1 = new Date(eventDate1).getTime();
    const date2 = new Date(eventDate2).getTime();
    const diff = Math.abs(date2 - date1);
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeDifference(`${days}д ${hours}ч ${minutes}м ${seconds}с`);
  };

  return {
    eventName, eventDate1, eventDate2, timeDifference,
    setEventName, setEventDate1, setEventDate2,
    calculateTimeDifference
  };
};
