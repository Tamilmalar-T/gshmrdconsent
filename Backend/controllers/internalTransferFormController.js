const InternalTransferFormModel = require('../models/internalTransferFormModel');

exports.createRecord = async (req, res) => {
  try {
    const { patientId, formData } = req.body;
    if (!patientId || !formData) {
      return res.status(400).json({ success: false, message: 'patientId and formData are required' });
    }
    const record = await InternalTransferFormModel.create(patientId, formData);
    const formattedRecord = {
      id: record.id,
      patient_id: record.patient_id,
      created_at: record.created_at,
      form_data: {
        patient: formData.patient,
        formDetails: formData.formDetails,
        handingOver: formData.handingOver
      }
    };
    res.status(201).json({ success: true, data: formattedRecord });
  } catch (error) {
    console.error('Error creating internalTransferForm:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const records = await InternalTransferFormModel.getByPatientId(req.params.patientId);
    const formattedRecords = records.map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      created_at: record.created_at,
      form_data: {
        patient: {
          name: record.patient_name,
          age: record.age,
          sex: record.sex,
          uhidNo: record.uhid_no,
          ipNo: record.ip_no,
          ward: record.ward,
          bedNo: record.bed_no
        },
        formDetails: {
          consultant: record.consultant,
          admissionDateTime: record.admission_datetime,
          transferDateTime: record.transfer_datetime,
          fromWard: record.from_ward,
          toWard: record.to_ward,
          nurseAccompanied: record.nurse_accompanied,
          reasonForTransfer: record.reason_transfer,
          conditionDiagnosis: record.condition_diagnosis,
          operationPerformed: record.operation_performed,
          bloodTransfused: record.blood_transfused
        },
        handingOver: record.handing_over || []
      }
    }));
    res.status(200).json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('Error fetching internalTransferForm:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
