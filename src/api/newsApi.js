const WORKER_URL = 'https://snahelper.colbyr416-927.workers.dev';

export const fetchNews = async (ticker, fromDate, toDate) => {
  try {
    // format the dates to YYYY-MM-DD format, removes all the other DATE data
    const response = await fetch(
      `${WORKER_URL}/api/stock/news?ticker=${ticker}&fromDate=${fromDate.toISOString().split('T')[0]}&toDate=${toDate.toISOString().split('T')[0]}`
    );

    // if response is not 200 then error occurred
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch news data');
    }

    // pull data and return it
    return await response.json();

  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}; 