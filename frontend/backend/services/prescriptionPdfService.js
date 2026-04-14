const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const UPLOADS_DIR = path.join(__dirname, '../uploads/prescriptions');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate PDF prescription
 * Contains: Hospital name, Doctor details, Patient details, Medicines, Dosage, Date, Digital signature, QR Code
 */
async function generatePrescriptionPDF(prescription, doctor, patient, hospitalName = 'CareFusion Hospital') {
    const filename = `prescription-${prescription.prescriptionId.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    const filepath = path.join(UPLOADS_DIR, filename);

    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);

            // Hospital header
            doc.fontSize(20).font('Helvetica-Bold').text(hospitalName, { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('E-Prescription', { align: 'center' });
            doc.moveDown();

            // Prescription ID with QR code
            const qrData = JSON.stringify({
                prescriptionId: prescription.prescriptionId,
                patientId: patient._id.toString(),
                date: prescription.createdAt
            });
            const qrBuffer = await QRCode.toBuffer(qrData, { width: 80, margin: 1 });
            doc.image(qrBuffer, 50, doc.y, { width: 80, height: 80 });
            doc.fontSize(14).font('Helvetica-Bold').text(`Prescription ID: ${prescription.prescriptionId}`, 150, doc.y + 25);
            doc.moveDown(5);

            // Date
            doc.fontSize(10).font('Helvetica').text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}`);
            doc.moveDown(2);

            // Patient details
            doc.fontSize(12).font('Helvetica-Bold').text('Patient Details');
            doc.fontSize(10).font('Helvetica')
                .text(`Name: ${patient.fullName}`)
                .text(`Age: ${patient.age || 'N/A'} | Gender: ${patient.gender || 'N/A'}`)
                .text(`Contact: ${patient.mobile || 'N/A'}`);
            doc.moveDown(2);

            // Doctor details
            doc.fontSize(12).font('Helvetica-Bold').text('Prescribing Doctor');
            doc.fontSize(10).font('Helvetica')
                .text(`Dr. ${doctor.fullName}`)
                .text(`${doctor.specialization} | ${doctor.department}`);
            doc.moveDown(2);

            // Diagnosis
            doc.fontSize(12).font('Helvetica-Bold').text('Diagnosis');
            doc.fontSize(10).font('Helvetica').text(prescription.diagnosis);
            doc.moveDown(2);

            // Medicines
            doc.fontSize(12).font('Helvetica-Bold').text('Medicines');
            prescription.medicines.forEach((med, i) => {
                doc.fontSize(10).font('Helvetica')
                    .text(`${i + 1}. ${med.name} - ${med.dosage}, ${med.frequency} - ${med.duration}`)
                    .text(`   Instructions: ${med.instructions || 'As directed by doctor'}`);
            });
            doc.moveDown(2);

            // Notes
            if (prescription.notes) {
                doc.fontSize(12).font('Helvetica-Bold').text('Additional Notes');
                doc.fontSize(10).font('Helvetica').text(prescription.notes);
                doc.moveDown(2);
            }

            // Digital signature section
            doc.fontSize(12).font('Helvetica-Bold').text('Digital Signature');
            doc.fontSize(9).font('Helvetica')
                .text(`Signed: ${prescription.signedAt ? new Date(prescription.signedAt).toISOString() : 'N/A'}`)
                .text(`Signature ID: ${prescription.digitalSignature || prescription.prescriptionId}`);
            doc.moveDown();

            // Footer
            doc.fontSize(8).font('Helvetica').fillColor('gray')
                .text('This is a digitally generated prescription. Valid for dispensing at authorized pharmacy only.', 50, doc.page.height - 80, { align: 'center', width: 500 });

            doc.end();

            writeStream.on('finish', () => {
                resolve({ filepath, filename, relativePath: `prescriptions/${filename}` });
            });
            writeStream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generatePrescriptionPDF, UPLOADS_DIR };
