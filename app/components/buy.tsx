import React, {useRef, useState} from 'react';
import styles from "./home.module.scss";

export function BuyPage() {
    const [isLoading, setIsLoading] = useState(true);
    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className={styles.buyContainer}>
            {isLoading && (
                <div className={styles.loadingContainer}>
                    {/* 在这里放置加载动画的内容 */}
                    Loading...
                </div>
            )}
            <iframe
                id="myIframe"
                className={`${styles.mIframe} ${isLoading ? styles.hidden : ''}`}
                src="https://www.mmingsheng.com//details/8BFAA78B"
                width="100%"
                height="100%"
                title="订阅"
                onLoad={handleIframeLoad}
            ></iframe>
        </div>
    );
};
