// url=https://www.figma.com/design/dpERREqOAyN14NDrF95z8Y/GearHub---Tech---Gear-Store-Design-System-(v2)?node-id=1-33
// source=src/public/js/admin.js
// component=KpiCard
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.findText('Label')?.textContent || 'TỔNG DOANH THU'
const value = instance.findText('Value')?.textContent || '32.460.000 ₫'

export default {
  example: figma.code`
    <div class="kpi-cell">
      <span class="kpi-label">${label}</span>
      <strong class="kpi-value">${value}</strong>
      <span class="kpi-trend positive">↑ +14.2%</span>
    </div>
  `,
  id: 'gearhub-kpi-card',
  metadata: { nestable: false }
}
