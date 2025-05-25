const WORKER_URL = 'https://snahelper.colbyr416-927.workers.dev';

export async function fetchStockPrice(ticker, startDate, endDate) {
  try {
    // format the dates to YYYY-MM-DD format, removes all the other DATE data
    const response = await fetch(
      `${WORKER_URL}/api/stock/price?ticker=${ticker}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
    );

    // if response is not 200 then error occurred
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stock data');
    }

    // pull data and return it
    return await response.json();

  } catch (error) {
    console.error('Error fetching stock price:', error);
    throw error;
  }
} 