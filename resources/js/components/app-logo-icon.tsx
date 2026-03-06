import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    const { className, ...rest } = props;
    return (
        <img
            {...rest}
            src="/DepED Buk_Logov2.png"
            alt="DepEd Bukidnon Logo"
            className={`object-contain ${className || ''}`}
        />
    );
}
