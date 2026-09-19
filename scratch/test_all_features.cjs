const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080/api';

async function fetchJSON(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const response = await fetch(fullUrl, options);
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return { ok: response.ok, status: response.status, data: json, raw: text };
  } catch (err) {
    return { ok: response.ok, status: response.status, data: null, raw: text, parseError: err.message };
  }
}

async function runTests() {
  console.log('=== 1. Testing Available Slots with City field ===');
  const examSlotsRes = await fetchJSON('/slots?type=EXAM');
  console.log('GET /api/slots?type=EXAM status:', examSlotsRes.status);
  if (Array.isArray(examSlotsRes.data) && examSlotsRes.data.length > 0) {
    console.log('Exam slot sample city:', examSlotsRes.data[0].city, '| centre:', examSlotsRes.data[0].centreName);
  }

  const medicalSlotsRes = await fetchJSON('/slots?type=MEDICAL');
  console.log('GET /api/slots?type=MEDICAL status:', medicalSlotsRes.status);
  if (Array.isArray(medicalSlotsRes.data) && medicalSlotsRes.data.length > 0) {
    console.log('Medical slot sample city:', medicalSlotsRes.data[0].city, '| centre:', medicalSlotsRes.data[0].centreName);
  }

  console.log('\n=== 2. Testing Medical / Exam Cancel JSON response ===');
  // First, check existing medical bookings or create one
  const appsRes = await fetchJSON('/applications/all');
  if (!appsRes.ok || !Array.isArray(appsRes.data) || appsRes.data.length === 0) {
    console.log('No applications found to test bookings with.');
  } else {
    const testApp = appsRes.data[0];
    console.log('Using test application:', testApp.id, 'Applicant:', testApp.applicantId);

    // Book medical
    if (medicalSlotsRes.data && medicalSlotsRes.data.length > 0) {
      const slot = medicalSlotsRes.data[0];
      const bookMedRes = await fetchJSON('/medical/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: 'test-cancel-user', slotId: slot.id })
      });
      console.log('Book Medical result status:', bookMedRes.status, bookMedRes.data ? 'ID: ' + bookMedRes.data.id : bookMedRes.raw);

      if (bookMedRes.ok && bookMedRes.data && bookMedRes.data.id) {
        // Cancel medical
        const cancelMedRes = await fetchJSON(`/medical/${bookMedRes.data.id}`, { method: 'DELETE' });
        console.log('Cancel Medical status:', cancelMedRes.status);
        console.log('Cancel Medical parsed data:', cancelMedRes.data);
        if (cancelMedRes.parseError) {
          console.error('FAILED: Medical cancel returned non-JSON:', cancelMedRes.raw);
        } else {
          console.log('SUCCESS: Medical cancel returned valid JSON with status:', cancelMedRes.data.status);
        }
      }
    }
  }

  console.log('\n=== 3. Testing Post-12-Hour Support Ticket Creation & Administrative Override ===');
  // Let's find an existing application or create one
  let targetApp = null;
  if (appsRes.data && appsRes.data.length > 0) {
    targetApp = appsRes.data[0];
  }

  if (targetApp) {
    console.log('Target application for ticket:', targetApp.id, 'Current Name:', targetApp.fullName, 'NIC:', targetApp.nic);

    // Create a Support Ticket via multipart/form-data
    const formData = new FormData();
    formData.append('applicationId', String(targetApp.id));
    formData.append('applicantId', targetApp.applicantId);
    formData.append('applicantName', targetApp.fullName);
    formData.append('applicantEmail', targetApp.email);
    formData.append('reason', 'Legal Name spelling and NIC correction as per National ID card');
    formData.append('requestedFullName', targetApp.fullName + ' (Corrected)');
    formData.append('requestedNic', '200012345678');
    formData.append('requestedAddress', 'No. 45/A, Galle Road, Colombo 03');

    // Create fake proof document
    const blob = new Blob(['Sample NIC binary content'], { type: 'text/plain' });
    formData.append('nicCopy', blob, 'nic_scan.txt');

    const ticketRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      body: formData
    });
    const ticketText = await ticketRes.text();
    console.log('POST /api/tickets status:', ticketRes.status);
    let createdTicket = null;
    try {
      createdTicket = JSON.parse(ticketText);
      console.log('Created Ticket Number:', createdTicket.ticketNumber, 'ID:', createdTicket.id, 'Status:', createdTicket.status);
    } catch (e) {
      console.log('Ticket creation response:', ticketText);
    }

    if (createdTicket && createdTicket.id) {
      // Test GET /api/tickets/{id}
      const getTicket = await fetchJSON(`/tickets/${createdTicket.id}`);
      console.log('GET /api/tickets/:id status:', getTicket.status, 'Ticket Number:', getTicket.data?.ticketNumber);

      // Execute Administrative Override
      console.log('\n--- Executing Officer Administrative Override ---');
      const overrideRes = await fetchJSON(`/tickets/${createdTicket.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerId: 'OFFICER-001',
          officerName: 'Senior Registration Officer Silva',
          officerNotes: 'Verified original NIC and supporting documents. Approved for atomic recreation.'
        })
      });

      console.log('Override result status:', overrideRes.status);
      console.log('Override response:', overrideRes.data);

      if (overrideRes.ok && overrideRes.data && overrideRes.data.newApplicationId) {
        const newAppId = overrideRes.data.newApplicationId;
        console.log(`SUCCESS: Atomic Override created new application #${newAppId}`);

        // Verify the new application has the updated details
        const newAppRes = await fetchJSON(`/applications/${newAppId}`);
        console.log('New application status:', newAppRes.status, 'Full Name:', newAppRes.data?.fullName, 'NIC:', newAppRes.data?.nic);

        // Verify old application is deleted from license_application
        const oldAppRes = await fetchJSON(`/applications/${targetApp.id}`);
        console.log('Old application lookup status:', oldAppRes.status, '(Expected 404 or not found since it was archived and purged)');

        // Verify audit log
        const auditRes = await fetchJSON('/tickets/audit');
        console.log('GET /api/tickets/audit total entries:', auditRes.data?.length);
        if (auditRes.data && auditRes.data.length > 0) {
          const latestAudit = auditRes.data[0];
          console.log('Latest Audit Log action:', latestAudit.action, 'Officer:', latestAudit.officerName, 'Details:', latestAudit.details);
        }
      }
    }
  }

  console.log('\n=== All Tests Completed ===');
}

runTests().catch(console.error);
