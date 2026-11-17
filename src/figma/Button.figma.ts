// url=https://www.figma.com/design/dpERREqOAyN14NDrF95z8Y/GearHub---Tech---Gear-Store-Design-System-(v2)?node-id=1-19
// source=src/public/css/style.css
// component=Button
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('Label') || 'Đặt lịch ngay'
const variant = instance.getEnum('Variant', {
  'Primary': 'btn-primary',
  'Secondary': 'btn-secondary',
  'Outline': 'btn-outline',
})

export default {
  example: figma.code`
    <button class="btn ${variant}">
      ${label}
    </button>
  `,
  id: 'gearhub-button',
  metadata: { nestable: true }
}
