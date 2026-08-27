import React from 'react';
import { Helmet } from 'react-helmet-async';
import SharedLayout from './SharedLayout';
import ModerationFormPage from '../employee/src/pages/manager/ModerationFormPage';

export default function ManagerModerationPage() {
  return (
    <SharedLayout title="Moderate Review">
      <Helmet>
        <title>Moderate Review | Kago HC</title>
      </Helmet>
      <ModerationFormPage />
    </SharedLayout>
  );
}
