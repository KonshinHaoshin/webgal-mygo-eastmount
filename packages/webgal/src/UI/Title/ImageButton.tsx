import { useState } from 'react';
import styles from './title.module.scss';

interface ImageButtonProps {
    normalImage: string;
    hoverImage: string;
    altText: string;
    onClick: () => void;
    disabled?: boolean;
    onMouseEnter?: () => void;
}

export default function ImageButton({
    normalImage,
    hoverImage,
    altText,
    onClick,
    disabled = false,
    onMouseEnter,
}: ImageButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const handleMouseEnter = () => {
        if (!disabled) {
            setIsHovered(true);
            onMouseEnter?.();
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsPressed(false);
    };

    const handleMouseDown = () => {
        if (!disabled) {
            setIsPressed(true);
        }
    };

    const handleMouseUp = () => {
        setIsPressed(false);
    };

    const handleClick = () => {
        if (!disabled) {
            onClick();
        }
    };

    const currentImage = isPressed || isHovered ? hoverImage : normalImage;

    return (
        <div
            className={styles.Title_button}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <img
                src={currentImage}
                alt={altText}
                className={styles.Title_button_image}
            />
        </div>
    );
}