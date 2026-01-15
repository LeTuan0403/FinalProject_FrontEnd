export const getLocalDateStr = (date: Date = new Date()): string => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

export const isFutureDate = (dateStr: string): boolean => {
    const todayStr = getLocalDateStr();
    return dateStr > todayStr;
};

export const formatTimeRange = (timeStr: string): string => {
    if (!timeStr) {return '';}
    if (!timeStr.includes('-')) {return timeStr;}

    const [start, end] = timeStr.split('-').map(s => s.trim());
    if (start === end) {return start;}
    return timeStr;
};

export const compareTimeStrings = (timeA: string | undefined, timeB: string | undefined): number => {
    const tA = timeA ? timeA.split('-')[0].trim() : '00:00';
    const tB = timeB ? timeB.split('-')[0].trim() : '00:00';
    return tA.localeCompare(tB);
};
