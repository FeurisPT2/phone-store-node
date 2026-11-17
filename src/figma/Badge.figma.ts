// url=https://www.figma.com/design/dpERREqOAyN14NDrF95z8Y/GearHub---Tech---Gear-Store-Design-System-(v2)?node-id=1-26
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
