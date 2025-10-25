import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, HelpCircle, X } from "lucide-react";
import "./alertbox.css";

const alertIcons = {
  warning: <AlertTriangle className="alert-icon warning-icon" />,
  info: <Info className="alert-icon info-icon" />,
  question: <HelpCircle className="alert-icon question-icon" />,
  success: <CheckCircle className="alert-icon success-icon" />,
  error: <XCircle className="alert-icon error-icon" />,
};

export default function AlertBox({ show, type = "info", title, message, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`alert-box ${type}`}
            initial={{ scale: 0.8, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <button className="alert-close" onClick={onClose}>
              <X size={18} />
            </button>

            <div className="alert-header">
              {alertIcons[type]}
              <h3>{title}</h3>
            </div>

            <p className="alert-message">{message}</p>

            {type === "question" ? (
              <div className="alert-buttons">
                <button className="alert-btn yes" onClick={onConfirm}>
                  Yes
                </button>
                <button className="alert-btn no" onClick={onClose}>
                  No
                </button>
              </div>
            ) : (
              <button className="alert-btn ok" onClick={onClose}>
                OK
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
