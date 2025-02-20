import React, { useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { Measure } from "@madie/madie-models/dist/Measure";
import { Model } from "@madie/madie-models/dist/Model";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { MeasureSchemaValidator } from "../../models/MeasureSchemaValidator";
import {
  MadieDialog,
  Select,
  TextField,
  Toast,
  MadieAlert,
} from "@madie/madie-design-system/dist/react";
import { Box } from "@mui/system";
import {
  getServiceConfig,
  ServiceConfig,
  useOktaTokens,
} from "@madie/madie-util";
import axios from "axios";
import { FormHelperText, MenuItem } from "@mui/material";
import { useFormik } from "formik";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DesktopDatePicker from "@mui/lab/DesktopDatePicker";
import DateAdapter from "@mui/lab/AdapterDateFns";
import { v4 as uuidv4 } from "uuid";

interface Toast {
  toastOpen: boolean;
  toastType: string;
  toastMessage: string;
}

const CreateNewMeasureDialog = ({ open, onClose }) => {
  const { getAccessToken } = useOktaTokens();
  const [toast, setToast] = useState<Toast>({
    toastOpen: false,
    toastType: null,
    toastMessage: "",
  });
  const { toastOpen, toastType, toastMessage } = toast;
  const formik = useFormik({
    initialValues: {
      measureName: "",
      model: "",
      cqlLibraryName: "",
      ecqmTitle: "",
      active: true,
      measurementPeriodStart: null,
      measurementPeriodEnd: null,
      // TO DO: validation, models for new entries
    } as Measure,
    validationSchema: MeasureSchemaValidator,
    onSubmit: async (values: Measure) => {
      await createMeasure(values);
    },
  });
  async function createMeasure(measure: Measure) {
    const config: ServiceConfig = await getServiceConfig();

    measure.measureSetId = uuidv4();
    measure.versionId = uuidv4();
    await axios
      .post<Measure>(config?.measureService?.baseUrl + "/measure", measure, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      })
      .then(({ status }) => {
        if (status === 201) {
          onClose(true);
          formik.resetForm();
          setToast({
            toastOpen: false,
            toastType: null,
            toastMessage: "",
          });
          const event = new Event("create");
          window.dispatchEvent(event);
        }
      })
      .catch((error) => {
        let msg: string = error.response.data.message;
        if (!!error.response.data.validationErrors) {
          for (const erroredField in error.response.data.validationErrors) {
            msg = msg.concat(
              ` ${erroredField} : ${error.response.data.validationErrors[erroredField]}`
            );
          }
        }
        setToast({
          toastOpen: true,
          toastType: "danger",
          toastMessage: msg,
        });
      });
  }

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <FormHelperText
          data-testid={`${name}-helper-text`}
          children={formik.errors[name]}
          error={isError}
        />
      );
    }
  }
  // style utilities
  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginTop: "23px",
  };
  const formRow = Object.assign({}, row, spaced);
  const gap = {
    columnGap: "24px",
    "& > * ": {
      flex: 1,
    },
  };
  const formRowGapped = Object.assign({}, formRow, gap);
  return (
    <MadieDialog
      form
      title="Create Measure"
      dialogProps={{
        open,
        onClose,
        onSubmit: formik.handleSubmit,
        sx: {
          zIndex: 9999,
        },
      }}
      cancelButtonProps={{
        variant: "secondary",
        onClick: onClose,
        cancelText: "Cancel",
        "data-testid": "create-new-measure-cancel-button",
        "aria-label": "create-new-measure-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "continue-button",
        "aria-label": "continue button",
        disabled: !(formik.isValid && formik.dirty),
        continueText: "Continue",
        continueIcon: (
          <ChevronRightIcon
            sx={{
              fontSize: 22,
              margin: "-9px -14px -7px 4px",
            }}
          />
        ),
      }}
    >
      <Toast
        toastKey="measure-create-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "server-error-alerts"
            : "measure-create-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={() => {
          setToast({
            toastOpen: false,
            toastType: null,
            toastMessage: "",
          });
        }}
        autoHideDuration={6000}
      />
      <MadieAlert
        type="warning"
        content={
          <>
            <h5 tw="py-1">CMS IDs can not be generated in MADiE</h5>
            <p>
              If your measure needs a CMS ID please create and generate your id
              in MAT and import your measure into MADiE.
            </p>
          </>
        }
        canClose={false}
      />
      <Box sx={formRow}>
        <TextField
          placeholder="Measure Name"
          required
          label="Measure Name"
          id="measureName"
          inputProps={{
            "data-testid": "measure-name-input",
            "aria-describedby": "measureName-helper-text",
            required: true,
          }}
          helperText={formikErrorHandler("measureName", true)}
          data-testid="measure-name-text-field"
          size="small"
          error={
            formik.touched.measureName && Boolean(formik.errors.measureName)
          }
          {...formik.getFieldProps("measureName")}
        />
      </Box>

      <Box sx={formRow}>
        <TextField
          placeholder="Enter CQL Library Name"
          required
          label="Measure CQL Library Name"
          id="cqlLibraryName"
          data-testid="cql-library-name"
          inputProps={{
            "data-testid": "cql-library-name-input",
            "aria-describedby": "cqlLibraryName-helper-text",
            required: true,
          }}
          helperText={formikErrorHandler("cqlLibraryName", true)}
          size="small"
          error={
            formik.touched.cqlLibraryName &&
            Boolean(formik.errors.cqlLibraryName)
          }
          {...formik.getFieldProps("cqlLibraryName")}
        />
      </Box>

      <Box sx={formRowGapped}>
        <TextField
          placeholder="eCQM Name"
          required
          label="eCQM Abbreviated Title"
          id="ecqmTitle"
          data-testid="ecqm-text-field"
          inputProps={{
            "data-testid": "ecqm-input",
            "aria-describedby": "ecqmTitle-helper-text",
            required: true,
          }}
          helperText={formikErrorHandler("ecqmTitle", true)}
          size="small"
          error={formik.touched.ecqmTitle && Boolean(formik.errors.ecqmTitle)}
          {...formik.getFieldProps("ecqmTitle")}
        />
      </Box>

      <Box sx={formRowGapped}>
        <Select
          placeHolder={{ name: "Model", value: "" }}
          required
          label="Model"
          id="model-select"
          inputProps={{
            "data-testid": "measure-model-input",
            id: "model-select",
            "aria-describedby": "model-select-helper-text",
            required: true,
          }}
          data-testid="measure-model-select"
          {...formik.getFieldProps("model")}
          error={formik.touched.model && Boolean(formik.errors.model)}
          helperText={formik.touched.model && formik.errors.model}
          size="small"
          options={Object.keys(Model).map((modelKey) => {
            return (
              <MenuItem
                key={modelKey}
                value={Model[modelKey]}
                data-testid={`measure-model-option-${Model[modelKey]}`}
              >
                {Model[modelKey]}
              </MenuItem>
            );
          })}
        />
      </Box>

      <Box sx={formRowGapped} data-testid="measurement-period-div">
        <LocalizationProvider dateAdapter={DateAdapter}>
          <DesktopDatePicker
            disableOpenPicker={true}
            label="Measurement Period - Start Date"
            inputFormat="MM/dd/yyyy"
            value={formik.values.measurementPeriodStart}
            onChange={(startDate) => {
              formik.setFieldValue("measurementPeriodStart", startDate);
            }}
            renderInput={(params) => {
              const { onChange, ...formikFieldProps } = formik.getFieldProps(
                "measurementPeriodStart"
              );
              return (
                <TextField
                  id="create-measure-period-start"
                  {...formikFieldProps}
                  {...params}
                  required
                  data-testid="measurement-period-start"
                  error={
                    formik.touched.measurementPeriodStart &&
                    Boolean(formik.errors.measurementPeriodStart)
                  }
                  helperText={formikErrorHandler(
                    "measurementPeriodStart",
                    true
                  )}
                  InputProps={{
                    "data-testid": "measurement-period-start-input",
                    "aria-describedby":
                      "create-measure-period-start-helper-text",
                    required: true,
                  }}
                />
              );
            }}
          />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={DateAdapter}>
          <DesktopDatePicker
            disableOpenPicker={true}
            label="Measurement Period - End Date"
            inputFormat="MM/dd/yyyy"
            value={formik.values.measurementPeriodEnd}
            onChange={(endDate) => {
              formik.setFieldValue("measurementPeriodEnd", endDate);
            }}
            renderInput={(params) => {
              const { onChange, ...formikFieldProps } = formik.getFieldProps(
                "measurementPeriodEnd"
              );
              return (
                <TextField
                  id="create-measure-period-end"
                  {...formikFieldProps}
                  {...params}
                  required
                  data-testid="measurement-period-end"
                  error={
                    formik.touched.measurementPeriodEnd &&
                    Boolean(formik.errors.measurementPeriodEnd)
                  }
                  helperText={formikErrorHandler("measurementPeriodEnd", true)}
                  InputProps={{
                    "data-testid": "measurement-period-end-input",
                    "aria-describedby": "create-measure-period-end-helper-text",
                    required: true,
                  }}
                />
              );
            }}
          />
        </LocalizationProvider>
      </Box>
    </MadieDialog>
  );
};

export default CreateNewMeasureDialog;
