// url=https://www.figma.com/design/rUvMCTXrbWVMSQRCU9D2Ld/GearHub---Tech---Gear-Store-Design-System?node-id=23-26
// source=src/public/css/style.css
// component=Badge
import figma from 'figma'
const instance = figma.selectedInstance

const type = instance.getEnum('Type', {
  'Hot': 'badge-hot',
  'Rescue': 'badge-rescue',
  'ZeroDeposit': 'badge-zero-deposit',
})

export default {
  example: figma.code`
    <span class="badge ${type}">
      Tag
    </span>
  `,
  id: 'gearhub-badge',
  metadata: { nestable: true }
}
