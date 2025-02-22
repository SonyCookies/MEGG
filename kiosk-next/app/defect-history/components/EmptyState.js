// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\defect-history\components\EmptyState.js

import PropTypes from "prop-types"

export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon className="w-12 h-12 text-gray-400 mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  )
}

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
}

