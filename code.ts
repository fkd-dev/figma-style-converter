
const colorStyleSourceCode = `
import 'package:flutter/material.dart';

class FigmaColors {
  const FigmaColors();

:colors
}
`;
const colorTmp = `  static const Color :name = Color(:hex);\n`;

const textStyleSourceCode = `
class FigmaTextStyles {
  const FigmaTextStyles();

:texts
}
`;
const textTmp = `
  TextStyle get :name => const TextStyle(
    fontSize: :fontSize,
    decoration: :decoration,
    fontFamily: :fontName,
    fontStyle: :fontStyle,
    fontWeight: :fontWeight,
    height: :height / :fontSize,
    letterSpacing: :space,
  );
`;

figma.showUI(__html__, {width: 600, height: 600, title: "Styles converter"});

figma.ui.onmessage = msg => {

  if (msg.type === 'analyze') {
    const colors = convertColorStyleToDart();
    const texts = convertTextStyleToDart();
    figma.ui.postMessage({ type: 'done', result : `${colors}\n\n${texts}` });
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

function convertColorStyleToDart(): string {
  const paints = figma.getLocalPaintStyles();
  let result: string = "";
  paints.map((value) => {
      value.paints.map((item) => {
          if ('color' in item) {
            const name = styleName(value.name);
            const o: string = item.opacity == null ? "FF" : to2ByteIntValue(item.opacity);
            const r = to2ByteIntValue(item.color.r);
            const g = to2ByteIntValue(item.color.g);
            const b = to2ByteIntValue(item.color.b);
            const hex = `0x${o + r + g + b}`;
            const color = `${name} : ${hex}\n`;
            console.log(`${color}\n`);
            let v = colorTmp.replace(/:name/g, name);
            v = v.replace(/:hex/g, hex);
            result = result + v;
          }
      });
  });
  return colorStyleSourceCode.replace(/:colors/, result);
}

function numberToHex(c: number): string {
  var hex = Math.round(c).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function to2ByteIntValue(o: number): string {
  return numberToHex(255 * o);
}

function convertTextStyleToDart(): string {
    const texts = figma.getLocalTextStyles();
    let result: string = "";
    texts.map((value) => {
      const name = styleName(value.name);
      const size = value.fontSize.toString();
      const decoration = textDecoration(value.textDecoration);
      const style = fontStyle(value.fontName.style);
      const weight = fontWeight(value.fontName.style);
      const height = lineHeight(value.lineHeight, value.fontSize);
      const spacing = as2decimalPlaces(value.letterSpacing.value).toString();
      const fontName = getFontName(value.fontName);

      let v: string = textTmp.replace(/:name/g, name);
      v = v.replace(/:fontSize/g, size);
      v = v.replace(/:decoration/g, decoration);
      v = v.replace(/:fontStyle/g, style);
      v = v.replace(/:fontWeight/g, weight);
      v = v.replace(/:height/g, height);
      v = v.replace(/:space/g, spacing);
      v = v.replace(/:fontName/g, fontName);
      result = result + v;
    });
    
    return textStyleSourceCode.replace(/:texts/, result);
}

function textDecoration(decoration: string): string {
  switch (decoration) {
    case 'NONE':
      return 'TextDecoration.none';
    case 'UNDERLINE':
      return 'TextDecoration.underline'
    case 'STRIKETHROUGH':
      return 'TextDecoration.lineThrough';
    default:
      return 'TextDecoration.none';
  }
}

function styleName(n: string): string {
  //  delete simbols and white space
  let name = n.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\\\/\s]+/g, '');
  //  uppercase to lowercase
  name = name.replace(/^(.)/g, function(match) {
    return match.toLowerCase();
  });
  return name;
}

function lineHeight(height: LineHeight, fontSize: number): string {
  let r = height.unit === 'PIXELS'  ? height.value
      : height.unit === 'PERCENT'   ? (height.value / 100) * fontSize
      : fontSize;
  return as2decimalPlaces(r).toString();
}

function fontWeight(style: string): string {
  return style.includes('Thin')     ? 'FontWeight.w100'
    : style.includes('ExtraLight')  ? 'FontWeight.w200'
    : style.includes('Light')       ? 'FontWeight.w300'
    : style.includes('Regular')     ? 'FontWeight.w400'
    : style.includes('Medium')      ? 'FontWeight.w500'
    : style.includes('SemiBold')    ? 'FontWeight.w600'
    : style.includes('Bold')        ? 'FontWeight.w700'
    : 'FontWeight.w400';
}

function getFontName(font: FontName): string {
  return font.family + font.style;
}

function fontStyle(style: string): string {
  return style.includes('Italic') ? 'FontStyle.italic' : 'FontStyle.normal';
}

function as2decimalPlaces(n: number): number {
  return Math.floor(n * 100) / 100;
}