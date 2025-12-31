-- Query 1: Error Rate by Endpoint
fields @timestamp, @message, requestId, errorType
| filter level = "error"
| stats count() by bin(5m) as errorCount, errorType
| sort errorCount desc

-- Query 2: AI Token Usage
fields @timestamp, requestId, tokensUsed, cost
| filter message like /AI generation completed/
| stats sum(tokensUsed) as totalTokens, sum(cost) as totalCost by bin(1h)

-- Query 3: P95 Latency by Operation
fields @timestamp, operation, duration
| filter message like /completed/
| stats pct(duration, 95) as p95Latency by operation

-- Query 4: File Upload Success Rate
fields @timestamp, @message
| filter operation = "file-upload"
| stats count() as total,
        sum(case when status = "success" then 1 else 0 end) as successful
        by bin(5m)
| fields total, successful, (successful/total)*100 as successRate

-- Query 5: Cold Start Duration
fields @timestamp, @initDuration
| filter @type = "REPORT"
| stats avg(@initDuration), max(@initDuration), pct(@initDuration, 95)


