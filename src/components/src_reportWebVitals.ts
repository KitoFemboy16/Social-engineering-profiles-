import { ReportHandler } from 'web-vitals';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

/**
 * Reports web vitals metrics to the provided callback function
 * 
 * This function measures the following Core Web Vitals metrics:
 * - CLS (Cumulative Layout Shift)
 * - FID (First Input Delay)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 * 
 * @param onPerfEntry Optional callback function to report metrics
 */
const reportWebVitals = (onPerfEntry?: ReportHandler): void => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // Measure and report each web vital metric
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
