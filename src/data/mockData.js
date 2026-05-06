export const mockDevices = [
  {
    id: 1,
    name: "iPhone 13",
    user: "John Doe",
    usage: 45,
    status: 'active',
    type: 'Smartphone',
    lastActive: '2024-01-20T10:30:00Z',
    model: "iPhone13,4",
    os: "iOS 16.2"
  },
  {
    id: 2,
    name: "Samsung S22",
    user: "Jane Smith",
    usage: 78,
    status: 'warning',
    type: 'Smartphone',
    lastActive: '2024-01-20T10:32:00Z',
    model: "SM-S901E",
    os: "Android 13"
  },
  {
    id: 3,
    name: "Google Pixel",
    user: "Mike Johnson",
    usage: 23,
    status: 'inactive',
    type: 'Smartphone',
    lastActive: '2024-01-20T09:15:00Z',
    model: "GD1YQ",
    os: "Android 14"
  },
  {
    id: 4,
    name: "OnePlus 9",
    user: "Sarah Wilson",
    usage: 91,
    status: 'danger',
    type: 'Smartphone',
    lastActive: '2024-01-20T10:33:00Z',
    model: "LE2115",
    os: "Android 13"
  },
  {
    id: 5,
    name: "iPad Pro",
    user: "Tom Brown",
    usage: 34,
    status: 'active',
    type: 'Tablet',
    lastActive: '2024-01-20T10:25:00Z',
    model: "iPad13,11",
    os: "iPadOS 16.2"
  }
];

export const mockAlerts = [
  {
    id: 1,
    severity: 'high',
    title: 'Excessive Usage Detected',
    device: 'Samsung S22',
    time: '2024-01-20T10:30:00Z',
    description: 'Device usage exceeded 90% for more than 1 hour',
    resolved: false
  },
  {
    id: 2,
    severity: 'medium',
    title: 'Restricted App Access',
    device: 'OnePlus 9',
    time: '2024-01-20T10:15:00Z',
    description: 'Attempt to access restricted application',
    resolved: false
  },
  {
    id: 3,
    severity: 'low',
    title: 'Unusual Activity Pattern',
    device: 'iPhone 13',
    time: '2024-01-20T09:30:00Z',
    description: 'Unusual usage pattern detected during work hours',
    resolved: true
  }
];

export const mockActivity = [
  {
    id: 1,
    device: 'iPhone 13',
    action: 'High usage detected',
    time: '2024-01-20T10:28:00Z',
    type: 'warning'
  },
  {
    id: 2,
    device: 'Samsung S22',
    action: 'Restricted app accessed',
    time: '2024-01-20T10:25:00Z',
    type: 'danger'
  },
  {
    id: 3,
    device: 'Google Pixel',
    action: 'Normal usage pattern',
    time: '2024-01-20T10:15:00Z',
    type: 'info'
  },
  {
    id: 4,
    device: 'iPad Pro',
    action: 'Device connected',
    time: '2024-01-20T10:10:00Z',
    type: 'success'
  }
];