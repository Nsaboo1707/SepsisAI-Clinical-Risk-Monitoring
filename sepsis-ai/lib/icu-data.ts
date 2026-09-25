export type PatientStatus = 'Critical' | 'Watch' | 'Stable'

export type Patient = {
  id: string
  bed: string
  name: string
  age: number
  hr: number
  bp: string
  spo2: number
  rr: number
  temp: number
  lactate: number
  risk: number
  status: PatientStatus
  admitted: string
  trend: number[]
  features: { label: string; value: string; contribution: number }[]
}

export type ClinicalAlert = {
  time: string
  title: string
  patientId: string
  tone: 'critical' | 'watch'
  type: 'lactate' | 'pressure' | 'respiratory' | 'temperature'
}

export const patients: Patient[] = [
  { id: 'PT-10482', bed: 'ICU-04', name: 'M. Anderson', age: 67, hr: 118, bp: '92/58', spo2: 91, rr: 27, temp: 38.9, lactate: 3.8, risk: 87, status: 'Critical', admitted: '2d 14h', trend: [52, 58, 61, 68, 74, 82, 87], features: [{ label: 'Lactate', value: '3.8 mmol/L', contribution: 34 }, { label: 'MAP', value: '69 mmHg', contribution: 26 }, { label: 'Temperature', value: '38.9°C', contribution: 18 }, { label: 'Respiratory rate', value: '27 /min', contribution: 12 }] },
  { id: 'PT-10477', bed: 'ICU-02', name: 'J. Williams', age: 54, hr: 102, bp: '101/64', spo2: 94, rr: 23, temp: 38.1, lactate: 2.7, risk: 64, status: 'Watch', admitted: '4d 03h', trend: [42, 45, 49, 51, 54, 61, 64], features: [{ label: 'Lactate', value: '2.7 mmol/L', contribution: 24 }, { label: 'Respiratory rate', value: '23 /min', contribution: 19 }, { label: 'Heart rate', value: '102 bpm', contribution: 14 }] },
  { id: 'PT-10491', bed: 'ICU-07', name: 'S. Patel', age: 72, hr: 96, bp: '109/68', spo2: 96, rr: 19, temp: 37.7, lactate: 1.9, risk: 42, status: 'Watch', admitted: '1d 08h', trend: [36, 38, 40, 44, 43, 41, 42], features: [{ label: 'MAP', value: '82 mmHg', contribution: 15 }, { label: 'Age', value: '72 years', contribution: 12 }] },
  { id: 'PT-10468', bed: 'ICU-01', name: 'R. Thompson', age: 61, hr: 81, bp: '124/76', spo2: 98, rr: 16, temp: 36.9, lactate: 1.2, risk: 18, status: 'Stable', admitted: '6d 11h', trend: [21, 20, 19, 18, 19, 17, 18], features: [{ label: 'No elevated predictors', value: 'Stable', contribution: 8 }] },
  { id: 'PT-10473', bed: 'ICU-06', name: 'L. Garcia', age: 45, hr: 88, bp: '118/72', spo2: 97, rr: 18, temp: 37.2, lactate: 1.4, risk: 24, status: 'Stable', admitted: '3d 20h', trend: [25, 24, 23, 23, 22, 24, 24], features: [{ label: 'Heart rate', value: '88 bpm', contribution: 7 }] },
  { id: 'PT-10486', bed: 'ICU-03', name: 'D. Brown', age: 59, hr: 111, bp: '97/61', spo2: 93, rr: 25, temp: 38.3, lactate: 2.9, risk: 73, status: 'Critical', admitted: '5d 02h', trend: [48, 53, 55, 59, 64, 69, 73], features: [{ label: 'MAP', value: '73 mmHg', contribution: 27 }, { label: 'Respiratory rate', value: '25 /min', contribution: 21 }, { label: 'Temperature', value: '38.3°C', contribution: 16 }] },
]

export const alerts: ClinicalAlert[] = [
  { time: '20:38', title: 'Rising lactate detected', patientId: 'PT-10482', tone: 'critical', type: 'lactate' },
  { time: '20:31', title: 'MAP below threshold', patientId: 'PT-10486', tone: 'critical', type: 'pressure' },
  { time: '20:12', title: 'Respiratory rate elevated', patientId: 'PT-10477', tone: 'watch', type: 'respiratory' },
  { time: '19:54', title: 'Temperature trend increasing', patientId: 'PT-10491', tone: 'watch', type: 'temperature' },
]

export const unitTrend = [
  { time: '06:00', risk: 38, threshold: 60 }, { time: '08:00', risk: 40, threshold: 60 }, { time: '10:00', risk: 43, threshold: 60 }, { time: '12:00', risk: 47, threshold: 60 }, { time: '14:00', risk: 51, threshold: 60 }, { time: '16:00', risk: 56, threshold: 60 }, { time: '18:00', risk: 61, threshold: 60 }, { time: '20:00', risk: 64, threshold: 60 },
]

export const getPatient = (id: string) => patients.find((patient) => patient.id === id)
export const getMap = (bp: string) => Math.round(bp.split('/').map(Number).reduce((sum, value, index) => sum + (index === 0 ? value : value * 2), 0) / 3)
export const getRiskTone = (risk: number) => risk >= 70 ? 'critical' : risk >= 40 ? 'watch' : 'stable'
export const summary = { high: patients.filter((patient) => patient.risk >= 70).length, medium: patients.filter((patient) => patient.risk >= 40 && patient.risk < 70).length, low: patients.filter((patient) => patient.risk < 40).length, average: Math.round(patients.reduce((total, patient) => total + patient.risk, 0) / patients.length) }
