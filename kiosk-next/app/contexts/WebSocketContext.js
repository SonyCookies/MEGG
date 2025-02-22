//D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\contexts\WebSocketContext.js

"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"

const WS_URL = "ws://localhost:8000/ws"
const PING_INTERVAL = 60000 

const WebSocketContext = createContext(null)

const logger = {
  log: (message) => {
    console.log(`[WebSocketContext] ${new Date().toISOString()}: ${message}`)
  },
  warn: (message) => {
    console.warn(`[WebSocketContext] ${new Date().toISOString()}: ${message}`)
  },
  error: (message) => {
    console.error(`[WebSocketContext] ${new Date().toISOString()}: ${message}`)
  },
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    logger.error("useWebSocket must be used within a WebSocketProvider")
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CLOSED)
  const ws = useRef(null)
  const pingIntervalRef = useRef(null)
  const messageIdCounter = useRef(0)


  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    pingIntervalRef.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action: "ping" }))
        logger.log("Ping sent to server")
      }
    }, PING_INTERVAL)
  }, [])

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
      logger.log("Ping interval cleared")
    }
  }, [])

  const connectWebSocket = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      logger.log("WebSocket is already connected")
      return
    }

    logger.log("Attempting to connect WebSocket...")
    ws.current = new WebSocket(WS_URL)

    ws.current.onerror = (error) => {
      logger.error(`WebSocket error: ${error.message || "Unknown error"}`)
      setReadyState(WebSocket.CLOSED)
    }

    ws.current.onopen = () => {
      logger.log("WebSocket connected")
      setReadyState(WebSocket.OPEN)
      startPing()
    }

    ws.current.onmessage = (event) => {
      logger.log(`Received message from WebSocket: ${event.data}`)
      try {
        const data = JSON.parse(event.data)
        if (data.action === "pong") {
          logger.log("Received pong from server")
          return
        }
        // Add a unique ID to the message
        data.id = `msg_${messageIdCounter.current++}`
        setLastMessage(data)
      } catch (error) {
        logger.error(`Error processing WebSocket message: ${error.message}`)
      }
    }

    ws.current.onclose = (event) => {
      logger.warn(`WebSocket disconnected: ${event.reason}`)
      setReadyState(WebSocket.CLOSED)
      stopPing()
      setTimeout(connectWebSocket, 5000)
    }
  }, [startPing, stopPing])

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (ws.current) {
        logger.log("Cleaning up WebSocket connection")
        ws.current.close()
      }
      stopPing()
    }
  }, [connectWebSocket, stopPing])

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      logger.log(`Message sent to WebSocket: ${JSON.stringify(message)}`)
    } else {
      logger.error("WebSocket is not connected. Message not sent.")
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, readyState }}>{children}</WebSocketContext.Provider>
  )
}