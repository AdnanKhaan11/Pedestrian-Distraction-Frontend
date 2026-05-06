import { useState, useEffect } from 'react';

const useDeviceData = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockDevices = [
          { id: 1, name: "iPhone 13", usage: 45, status: 'active', type: 'Smartphone' },
          { id: 2, name: "Samsung S22", usage: 78, status: 'warning', type: 'Smartphone' },
          { id: 3, name: "Google Pixel", usage: 23, status: 'inactive', type: 'Smartphone' },
          { id: 4, name: "OnePlus 9", usage: 91, status: 'danger', type: 'Smartphone' },
          { id: 5, name: "iPad Pro", usage: 34, status: 'active', type: 'Tablet' },
        ];
        setDevices(mockDevices);
        setLoading(false);
      }, 1000);
    };

    fetchDevices();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setDevices(prev => prev.map(device => ({
        ...device,
        usage: Math.max(0, Math.min(100, device.usage + (Math.random() - 0.5) * 10))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { devices, loading };
};

export default useDeviceData;