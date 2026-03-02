export const SALON_DATA = {
  id: 'agenda-facil-demo',
  name: 'AgendaFácil Pro Studio',
  phone: '(11) 99999-9999',
  address: 'Rua das Flores, 123 - São Paulo, SP',
  workingHours: {
    monday: '09:00 - 18:00',
    tuesday: '09:00 - 18:00',
    wednesday: '09:00 - 18:00',
    thursday: '09:00 - 18:00',
    friday: '09:00 - 19:00',
    saturday: '09:00 - 17:00',
    sunday: 'Fechado',
  },
  services: [
    { id: '1', name: 'Corte Masculino', duration: 30, price: 50, category: 'Cabelo' },
    { id: '2', name: 'Barba Completa', duration: 25, price: 35, category: 'Barba' },
    { id: '3', name: 'Corte Feminino', duration: 60, price: 120, category: 'Cabelo' },
    { id: '4', name: 'Manicure', duration: 45, price: 40, category: 'Unhas' },
    { id: '5', name: 'Pedicure', duration: 45, price: 45, category: 'Unhas' },
    { id: '6', name: 'Limpeza de Pele', duration: 90, price: 150, category: 'Estética' },
  ],
  employees: [
    { id: 'e1', name: 'Ricardo Silva', role: 'Barbeiro', services: ['1', '2'] },
    { id: 'e2', name: 'Ana Oliveira', role: 'Cabeleireira', services: ['3'] },
    { id: 'e3', name: 'Carla Santos', role: 'Manicure/Pedicure', services: ['4', '5'] },
  ],
  appointments: [
    {
      id: 'a1',
      clientName: 'João Ferreira',
      clientPhone: '11988887777',
      serviceId: '1',
      employeeId: 'e1',
      time: '09:00',
      date: '2024-05-20',
      status: 'confirmado'
    },
    {
      id: 'a2',
      clientName: 'Maria Silva',
      clientPhone: '11977776666',
      serviceId: '4',
      employeeId: 'e3',
      time: '10:30',
      date: '2024-05-20',
      status: 'pendente'
    }
  ]
};