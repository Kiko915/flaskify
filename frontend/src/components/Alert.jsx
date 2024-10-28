import PropTypes from 'prop-types';

const Alert = ({ type, message }) => {
  const baseStyle = "p-4 mb-4 rounded-md text-white";
  const typeStyles = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className={`${baseStyle} ${typeStyles[type]}`}>
      {message}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.string.isRequired,
};

export default Alert;