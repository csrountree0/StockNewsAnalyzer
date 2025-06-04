import { useState } from 'react'
import './App.css'
import { fetchStockPrice } from './api/stockPriceApi'
import { fetchNews } from './api/newsApi'
import StockChart from './components/StockChart'

function App() {
  const [isDark, setIsDark] = useState(true)
  const [tickerInput, setTickerInput] = useState('')
  const [submittedTicker, setSubmittedTicker] = useState('')
  const [date, setDate] = useState('')
  const [timeRange, setTimeRange] = useState('week')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ ticker: '', date: '' })
  const [stockData, setStockData] = useState(null)
  const [displayData, setDisplayData] = useState(null)
  const [newsData, setNewsData] = useState([])
  const [sortBy, setSortBy] = useState('all')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = { ticker: '', date: '' }
    
    if (!tickerInput.trim()) {
      newErrors.ticker = 'Stock ticker is required'
    }
    if (!date) {
      newErrors.date = 'Date is required'
    } else {
      const selectedDate = new Date(date)
      const today = new Date()
      
      if (selectedDate > today) {
        newErrors.date = 'Cannot select a future date'
      }
    }

    if (newErrors.ticker || newErrors.date) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const endDate = new Date(date)
      const startDate = new Date(date)
      startDate.setFullYear(startDate.getFullYear())
      const oneYearLater = new Date(date)
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
      const [stockResult, newsResult] = await Promise.all([
        fetchStockPrice(tickerInput, startDate, oneYearLater),
        fetchNews(tickerInput, endDate, endDate)
      ]);

      setStockData(stockResult)
      setDisplayData(stockResult.slice(0, 7))

      // fetch sentiment scores for each article
      const inputs = newsResult.map(article => `${article.headline} ${article.summary}`);
      const sentimentResponse = await fetch('https://snahelper.colbyr416-927.workers.dev/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputs
        })
      });

      let sentimentScores = await sentimentResponse.json();
      sentimentScores = JSON.parse(JSON.stringify(sentimentScores));

      setNewsData(newsResult.map((article, i) => ({
        ...article,
        sentimentLabel: sentimentScores[0][i].label,
        sentimentConfidence: sentimentScores[0][i].score
      })).sort((a, b) => b.sentimentConfidence - a.sentimentConfidence));
      setErrors({ ticker: '', date: '' }); // remove any previous errors
      setSubmittedTicker(tickerInput) // set submitted ticker
    } catch (error) {
      console.error('Error:', error)
      setErrors(prev => ({
        ...prev,
        ticker: 'Error fetching data. Please check the ticker symbol.'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
    if (!stockData) return

    let sliceLength
    switch(newRange) {
      case 'week':
        sliceLength = 7
        break
      case 'month':
        sliceLength = 30
        break
      case 'year':
        sliceLength = stockData.length
        break
      default:
        sliceLength = 7
    }

    setDisplayData(stockData.slice(0, sliceLength))
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-4 sm:px-4 flex justify-between items-center">
          <div className="flex-1"></div>
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold cursor-default ${isDark ? 'text-white' : 'text-gray-900'}`}>Stock News Analyzer</h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 sm:p-2 rounded-lg cursor-pointer"
            >
              {isDark ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500 hover:fill-none stroke-yellow-500" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 fill-none stroke-gray-700 hover:fill-gray-700 hover:stroke-none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-4 px-3 sm:py-6 sm:px-4 lg:px-8">
        {/* Search Form */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6`}>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label htmlFor="ticker" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stock Ticker
                </label>
                <input
                  type="text"
                  id="ticker"
                  value={tickerInput}
                  onChange={(e) => {
                    setTickerInput(e.target.value.toUpperCase())
                    setErrors(prev => ({ ...prev, ticker: '' }))
                  }}
                  placeholder="e.g. AAPL"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${errors.ticker ? 'border-red-500' : ''}`}
                />
                {errors.ticker && (
                  <p className="mt-1 text-sm text-red-500">{errors.ticker}</p>
                )}
              </div>
              <div>
                <label htmlFor="date" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setErrors(prev => ({ ...prev, date: '' }))
                  }}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white [&::-webkit-calendar-picker-indicator]:invert' 
                      : 'bg-white border-gray-300'
                  } ${errors.date ? 'border-red-500' : ''}`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing...' : 'Analyze News Impact'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 sm:p-6`}>
          <div className="space-y-4 sm:space-y-6">
            {/* Stock Price Chart */}
            <div className={`border-2 border-dashed rounded-lg ${
              isDark ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className="w-full">
                {displayData ? (
                  <div>
                    <div className="flex justify-end mb-2">
                      <select
                        value={timeRange}
                        onChange={(e) => handleTimeRangeChange(e.target.value)}
                        className={`appearance-none rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm pr-7 pl-1 ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="week">1 Week</option>
                        <option value="month">1 Month</option>
                        <option value="year">1 Year</option>
                      </select>
                    </div>
                    <StockChart data={displayData} ticker={submittedTicker} />
                  </div>
                ) : (
                  <p className={`text-center text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Stock price chart will appear here
                  </p>
                )}
              </div>
            </div>

            {/* News Articles Section */}
            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Related News Articles</h2>
                <div className="relative mr-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`appearance-none rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm pr-7 pl-1 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 mt-1 flex items-center px-2">
                    <svg className={`h-4 w-4 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {newsData.length>0 ?
                  newsData.filter(article => sortBy === 'all' || article.sentimentLabel === sortBy)
                  .sort((a, b) => b.sentimentConfidence - a.sentimentConfidence)
                  .map((article, index) => (
                    <div 
                      key={index}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-500 transition-colors"
                        >
                          {article.headline}
                        </a>
                        <span className={`px-2 py-1 rounded-full ${
                          article.sentimentLabel === 'positive' 
                            ? 'text-green-500'
                            : article.sentimentLabel === 'neutral'
                              ? 'text-orange-400'
                              : 'text-red-600'
                        }`}>
                          {article.sentimentLabel} ({(article.sentimentConfidence * 100).toFixed(2)}%)
                        </span>
                      </h3>
                      <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {article.summary}
                      </p>
                      <div className={`mt-2 flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>Published: </span>
                        <span className="ml-1">{new Date(article.datetime * 1000).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>Source: {article.source}</span>
                      </div>
                    </div>
                  ))
                : submittedTicker!== '' 
                    ? 
                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p className="text-lg font-medium mb-2">No News Available</p>
                      <p className="text-sm">There are no news articles available for {submittedTicker} on {date ? new Date(new Date(date).getTime() + 86400000).toLocaleDateString() : 'the selected date'}.</p>
                    </div>
              :null
              }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
