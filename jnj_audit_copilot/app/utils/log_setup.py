import logging
import os

from ..common.config import LOG_FILE


def setup_logger():
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

    # Create log file if not present
    if not os.path.exists(LOG_FILE):
        open(LOG_FILE, "w").close()
    # Create a logger object
    logger = logging.getLogger(LOG_FILE)
    logger.setLevel(logging.DEBUG)  # Set the minimum level of logs to capture

    # Remove any existing handlers associated with the logger
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create file handler which logs even debug messages
    # put mode='a' if you want to append to old logfile. 'w' creates new .log
    # everytime
    fh = logging.FileHandler(LOG_FILE, mode="w")
    fh.setLevel(logging.DEBUG)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    fh.setFormatter(formatter)
    # ch.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(fh)


# get logger instance
def get_logger():
    return logging.getLogger(LOG_FILE)
