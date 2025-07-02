import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddCandidateForm from '../components/AddCandidateForm';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch global
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.clearAllMocks();
});

const renderForm = () =>
  render(
    <BrowserRouter>
      <AddCandidateForm />
    </BrowserRouter>
  );

describe('Formulario de candidatos', () => {
  test('1. No permite enviar si los campos obligatorios están vacíos', async () => {
    renderForm();
    fireEvent.click(screen.getByText(/guardar candidato/i));
    expect(await screen.findAllByText(/obligatorio|required|ingrese/i)).toBeTruthy();
  });

  test('2. No permite adjuntar archivo no permitido', async () => {
    renderForm();
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/cv o documento/i);
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText(/solo se permiten archivos pdf y docx/i)).toBeInTheDocument();
  });

  test('3. No permite adjuntar archivo demasiado grande', async () => {
    renderForm();
    // 6MB file
    const file = new File([new ArrayBuffer(6 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/cv o documento/i);
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText(/demasiado grande/i)).toBeInTheDocument();
  });

  test('4. Envío exitoso sin adjunto', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '+34 123 456 789' } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Calle 1' } });
    fireEvent.change(screen.getByLabelText(/educación/i), { target: { value: 'Universidad' } });
    fireEvent.change(screen.getByLabelText(/experiencia laboral/i), { target: { value: '2 años' } });
    fireEvent.click(screen.getByText(/guardar candidato/i));
    expect(await screen.findByText(/añadido exitosamente/i)).toBeInTheDocument();
  });

  test('5. Envío exitoso con adjunto válido', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'López' } });
    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'ana@test.com' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '+34 987 654 321' } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Calle 2' } });
    fireEvent.change(screen.getByLabelText(/educación/i), { target: { value: 'Máster' } });
    fireEvent.change(screen.getByLabelText(/experiencia laboral/i), { target: { value: '3 años' } });
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/cv o documento/i);
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/guardar candidato/i));
    expect(await screen.findByText(/añadido exitosamente/i)).toBeInTheDocument();
  });
}); 