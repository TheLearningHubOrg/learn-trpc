export interface Item {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  memoryUsageMb: number;
  environment: string;
  timestamp: string;
}
