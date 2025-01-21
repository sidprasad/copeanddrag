/**
 * 
 * Implementation of the Phyllotactic Color-Picking Algorithm
 * that is CIELAB informed.
 * 
 */

import chroma from 'chroma-js';

export class ColorPicker {
    private colors: string[];
    private index: number;

    constructor(totalColors: number) {
        this.colors = this.generateColors(totalColors);
        this.index = 0;
    }

    // Generate a specified number of colors using the Phyllotactic Color-Picking Algorithm
    private generateColors(totalColors: number): string[] {
        const colors: string[] = [];
        for (let i = 0; i < totalColors; i++) {
            colors.push(this.phyllotacticColor(i));
        }
        return colors;
    }

    // Get the next color in the sequence
    public getNextColor(): string {
        if (this.index >= this.colors.length) {
            this.index = 0; // Reset index if it exceeds the number of colors
        }
        return this.colors[this.index++];
    }

    // Phyllotactic Color-Picking Algorithm using CIELAB color space
    private phyllotacticColor(index: number): string {
        const goldenAngle = 137.5 * (Math.PI / 180); // Convert to radians
        const radius = 100; // Radius of the circle
        const angle = index * goldenAngle;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        // Convert the position to a color in the CIELAB color space
        const l = 50; // Lightness
        const a = x; // Position on the a* axis
        const b = y; // Position on the b* axis

        // Convert CIELAB to RGB using chroma.js
        const color = chroma.lab(l, a, b).rgb();


        // Apply a factor to darken the colors
        const darkFactor = 1; // Adjust this factor to make the colors darker
        const darkR = Math.round(color[0] * darkFactor);
        const darkG = Math.round(color[1] * darkFactor);
        const darkB = Math.round(color[2] * darkFactor);

        return `rgb(${darkR}, ${darkG}, ${darkB})`;
    }

    // Helper function to convert RGB to CIELAB
    private rgbToLab(r: number, g: number, b: number): { L: number, a: number, b: number } {
        const rgb = [r / 255, g / 255, b / 255];
        const xyz = this.rgbToXyz(rgb);
        return this.xyzToLab(xyz);
    }

    // Helper function to convert RGB to XYZ
    private rgbToXyz(rgb: number[]): number[] {
        const matrix = [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041]
        ];

        const linearRgb = rgb.map(c => {
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        const xyz: number[] = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                xyz[i] += matrix[i][j] * linearRgb[j];
            }
        }

        return xyz;
    }

    // Helper function to convert XYZ to CIELAB
    private xyzToLab(xyz: number[]): { L: number, a: number, b: number } {
        const [x, y, z] = xyz.map(v => v / 100);
        const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
        const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
        const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

        return {
            L: (116 * fy) - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }
}

