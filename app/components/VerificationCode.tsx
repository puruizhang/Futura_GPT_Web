import React from 'react';
import styles from './VerificationCode.module.scss';

interface VerificationCodeProps {
    code: string;
}

const VerificationCode: React.FC<VerificationCodeProps> = ({ code }) => {
    return (
        <div className={styles['verification-code']}>
            <span className={styles['code-label']}>验证码:</span>
            <img src={code} alt="Verification Code" className={styles['code-image']} />
        </div>
    );
};

export default VerificationCode;
