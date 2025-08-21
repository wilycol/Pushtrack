import { ReportSchedule } from '../../types';

const DB_KEY = 'pushtrack_schedules';

export const getSchedules = (): ReportSchedule[] => {
  try {
    const rawData = localStorage.getItem(DB_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error("Failed to retrieve schedules:", error);
    return [];
  }
};

export const saveSchedules = (schedules: ReportSchedule[]): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error("Failed to save schedules:", error);
  }
};

export const saveSchedule = (scheduleToSave: ReportSchedule): void => {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === scheduleToSave.id);
  if (index > -1) {
    schedules[index] = scheduleToSave;
  } else {
    schedules.push(scheduleToSave);
  }
  saveSchedules(schedules);
};

export const deleteSchedule = (id: string): void => {
  let schedules = getSchedules();
  schedules = schedules.filter(s => s.id !== id);
  saveSchedules(schedules);
};

export const checkAndRunSchedules = (): ReportSchedule[] => {
  const now = new Date();
  const schedules = getSchedules();
  const schedulesToRun: ReportSchedule[] = [];

  const activeSchedules = schedules.filter(s => s.active);

  for (const schedule of activeSchedules) {
    const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const runTimeToday = new Date();
    runTimeToday.setHours(hours, minutes, 0, 0);

    let shouldRun = false;
    
    // Check if the scheduled time for today has passed and it hasn't run today
    if (now >= runTimeToday && (!lastRun || lastRun < runTimeToday)) {
        switch (schedule.frequency) {
            case 'daily':
                shouldRun = true;
                break;
            case 'weekly':
                // Runs on Mondays (1)
                if (now.getDay() === 1) {
                    shouldRun = true;
                }
                break;
            case 'monthly':
                // Runs on the 1st of the month
                if (now.getDate() === 1) {
                    shouldRun = true;
                }
                break;
        }
    }
    
    if (shouldRun) {
        schedulesToRun.push(schedule);
    }
  }

  return schedulesToRun;
};

export const updateLastRun = (scheduleId: string): void => {
    const schedules = getSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if(schedule) {
        schedule.lastRunAt = new Date().toISOString();
        saveSchedules(schedules);
    }
};