// Generate a random 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
  
  // Calculate OTP expiry time (15 minutes from now)
  export const calculateOTPExpiry = () => {
    return new Date(Date.now() + 15 * 60 * 1000).toISOString()
  }
  
  