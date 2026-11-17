// url=https://www.figma.com/design/rUvMCTXrbWVMSQRCU9D2Ld/GearHub---Tech---Gear-Store-Design-System?node-id=23-19
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
