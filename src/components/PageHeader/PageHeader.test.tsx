import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import {
  screen,
  render,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route } from "react-router";
import { act, Simulate } from "react-dom/test-utils";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { mockLibraryName, mockMeasureName } from "../NewMeasure/bulkCreate";
import axios from "axios";
import PageHeader from "../PageHeader/PageHeader";
import { Model } from "@madie/madie-models/dist/Model";

const mockLib = mockLibraryName();
const mockName = mockMeasureName();

const mockFormikInfo = {
  measureName: mockName,
  createdBy: "test",
  model: Model.QICORE.valueOf(),
  cqlLibraryName: mockLib,
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/05/2022",
  measurementPeriodEnd: "03/07/2022",
  active: true,
};
const mockLibraryInfo = {
  id: "randomstring",
  cqlLibraryName: "H1Z1",
  model: Model.QICORE.valueOf(),
  version: "0.0.000",
  draft: true,
  cqlErrors: true,
  cql: 'library H1Z1 version \'15.0.100\'\nusing QICore version \'4.1.0\'\nparameter "Measurement Period" Interval<DateTime>\ncontext Patient\ndefine "Definition 1":\n  true\ndefine "Definition 2":\n  true\ndefine "Definition 3":\n  false asdfasdfa sdfasd f',
  elmJson: null,
  elmXml: null,
  createdAt: "2022-08-30T00:38:53.304Z",
  createdBy: "test",
  lastModifiedAt: "2022-08-30T00:40:51.496Z",
  lastModifiedBy: "test",
  publisher: null,
  description: null,
  experimental: false,
};

jest.mock("@madie/madie-util", () => ({
  getServiceConfig: () => ({
    measureService: {
      baseUrl: "example-service-url",
    },
  }),
  measureStore: {
    state: {
      createdBy: "test",
      measureName: "test",
    },
    initialState: {
      createdBy: "test",
      measureName: "test",
    },
    subscribe: (set) => {
      set(mockFormikInfo);
      return { unsubscribe: () => null };
    },
    unsubscribe: () => null,
  },
  cqlLibraryStore: {
    state: null,
    initialState: null,
    subscribe: (set) => {
      set(mockLibraryInfo);
      return { unsubscribe: () => null };
    },
    unsubscribe: () => null,
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test", //#nosec
  }),
}));

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
let postData: object = { status: 201 };
let getData: object = { status: 200 };
mockedAxios.post.mockResolvedValueOnce(postData);
mockedAxios.get.mockResolvedValueOnce(getData);
const { findByTestId, queryByText, queryByTestId, getByTestId } = screen;

describe("Page Header and Dialogs", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Navigating to the cql-libraries page presents us with a library specific header", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/cql-libraries",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );
      const dialogButton = await findByTestId("create-new-cql-library-button");
      expect(dialogButton).toBeTruthy();
    });
  });

  test("Navigating to the cql-libraries/edit page presents us with a library specific header", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/cql-libraries/randomstring/edit/details",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(queryByText("QI-Core v4.1.1")).toBeInTheDocument();
      });
    });
  });

  test("Clicking on new library button retains the same library page", () => {
    let testHistory, testLocation;
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/cql-libraries",
            search: "",
            hash: "",
            state: undefined,
            key: "1fewtg",
          },
        ]}
      >
        <PageHeader />
        <Route
          path="*"
          render={({ history, location }) => {
            testHistory = history;
            testLocation = location;
            return null;
          }}
        />
      </MemoryRouter>
    );
    act(async () => {
      const libraryButton = await findByTestId("create-new-cql-library-button");
      expect(libraryButton).toBeTruthy();
      fireEvent.click(libraryButton);
      expect(testLocation.pathname).toBe("/cql-libraries");
    });
  });

  test("Clicking on create opens up the create dialog", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      const dialog = await findByTestId("dialog-form");
      expect(dialog).toBeTruthy();
    });
  });

  test("Clicking on delete broadcasts an event", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures/randomstroning/edit/details",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );

      const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

      const deleteButton = await findByTestId("delete-measure-button");
      expect(deleteButton).toBeTruthy();
      expect(deleteButton).toBeEnabled();
      act(() => {
        fireEvent.click(deleteButton);
      });
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchEventSpy.mock.calls[0][0].type).toBe("delete-measure");
    });
  });

  test("Form items are all there except for our hidden item", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      expect(await findByTestId("measure-name-text-field")).toBeInTheDocument();
      expect(await findByTestId("measure-model-select")).toBeInTheDocument();
      expect(await findByTestId("cql-library-name")).toBeInTheDocument();
      expect(await findByTestId("ecqm-text-field")).toBeInTheDocument();
      expect(await findByTestId("continue-button")).toBeInTheDocument();
    });
  });

  // temporarily skipping until it's added back in to document
  test.skip("checking the checkbox for manual entry makes cmsid visible", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      const manualCheck = await findByTestId("manual-generate-checkbox");
      expect(manualCheck).toBeInTheDocument();
      fireEvent.click(manualCheck);
      const autoCheck = await findByTestId("auto-generate-checkbox");
      expect(autoCheck).toBeInTheDocument();
    });
  });

  test("our submission works as intended", async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );

      const dialogButton = await findByTestId("create-new-measure-button");
      expect(queryByTestId("create-dialog")).not.toBeInTheDocument();
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      // we gotta hit the input to change the value of material ui components. make sure they have ids
      const nameNode = await getByTestId("measure-name-input");
      userEvent.type(nameNode, mockFormikInfo.measureName);
      expect(nameNode.value).toBe(mockFormikInfo.measureName);
      Simulate.change(nameNode);

      fireEvent.click(getByTestId("measure-name-text-field"));
      fireEvent.blur(getByTestId("measure-name-text-field"));

      const libraryNode = await getByTestId("cql-library-name-input");
      userEvent.type(libraryNode, mockFormikInfo.cqlLibraryName);
      expect(libraryNode.value).toBe(mockFormikInfo.cqlLibraryName);
      Simulate.change(libraryNode);

      const ecqmNode = await getByTestId("ecqm-input");
      userEvent.type(ecqmNode, mockFormikInfo.ecqmTitle);
      expect(ecqmNode.value).toBe(mockFormikInfo.ecqmTitle);
      Simulate.change(ecqmNode);

      const modelSelect = await getByTestId("measure-model-select");
      fireEvent.click(modelSelect);
      const modelNode = await getByTestId("measure-model-input");
      fireEvent.select(modelNode, { target: { value: mockFormikInfo.model } });
      expect(modelNode.value).toBe(mockFormikInfo.model);
      Simulate.change(modelNode);

      const measurementPeriodStartNode = getByTestId(
        "measurement-period-start"
      );
      const measurementPeriodStartInput = within(
        measurementPeriodStartNode
      ).getByRole("textbox");

      userEvent.type(
        measurementPeriodStartInput,
        mockFormikInfo.measurementPeriodStart
      );
      await act(async () => {
        await waitFor(() =>
          expect(measurementPeriodStartInput.value).toBe(
            mockFormikInfo.measurementPeriodStart
          )
        );
      });

      const measurementPeriodEndNode = getByTestId("measurement-period-end");
      const measurementPeriodEndInput = within(
        measurementPeriodEndNode
      ).getByRole("textbox");
      userEvent.type(
        measurementPeriodEndInput,
        mockFormikInfo.measurementPeriodEnd
      );
      expect(measurementPeriodEndInput.value).toBe(
        mockFormikInfo.measurementPeriodEnd
      );

      const submitButton = await findByTestId("continue-button");
      await waitFor(() => expect(submitButton).not.toBeDisabled(), {
        timeout: 5000,
      });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalled(),
          {
            timeout: 5000,
          };
      });
      await waitFor(() => {
        expect(queryByTestId("server-error-alerts")).not.toBeInTheDocument();
      });
    });
  }, 20000);

  // same values aside from mockReject
  test("our submission fails as with generic error message", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "a message",
        },
      },
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/measures",
            search: "",
            hash: "",
            state: undefined,
            key: "thisisareallyfakekey",
          },
        ]}
      >
        <PageHeader />
      </MemoryRouter>
    );

    const dialogButton = await findByTestId("create-new-measure-button");
    expect(queryByTestId("create-dialog")).not.toBeInTheDocument();
    expect(dialogButton).toBeTruthy();
    fireEvent.click(dialogButton);
    // we gotta hit the input to change the value of material ui components. make sure they have ids
    const nameNode = await getByTestId("measure-name-input");
    userEvent.type(nameNode, mockFormikInfo.measureName);
    expect(nameNode.value).toBe(mockFormikInfo.measureName);
    Simulate.change(nameNode);

    fireEvent.click(getByTestId("measure-name-text-field"));
    fireEvent.blur(getByTestId("measure-name-text-field"));

    const libraryNode = await getByTestId("cql-library-name-input");
    userEvent.type(libraryNode, mockFormikInfo.cqlLibraryName);
    expect(libraryNode.value).toBe(mockFormikInfo.cqlLibraryName);
    Simulate.change(libraryNode);

    const ecqmNode = await getByTestId("ecqm-input");
    userEvent.type(ecqmNode, mockFormikInfo.ecqmTitle);
    expect(ecqmNode.value).toBe(mockFormikInfo.ecqmTitle);
    Simulate.change(ecqmNode);

    const modelSelect = await getByTestId("measure-model-select");
    fireEvent.click(modelSelect);
    const modelNode = await getByTestId("measure-model-input");
    fireEvent.select(modelNode, { target: { value: mockFormikInfo.model } });
    expect(modelNode.value).toBe(mockFormikInfo.model);
    Simulate.change(modelNode);

    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox");
    userEvent.type(
      measurementPeriodStartInput,
      mockFormikInfo.measurementPeriodStart
    );
    expect(measurementPeriodStartInput.value).toBe(
      mockFormikInfo.measurementPeriodStart
    );

    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox");
    userEvent.type(
      measurementPeriodEndInput,
      mockFormikInfo.measurementPeriodEnd
    );
    expect(measurementPeriodEndInput.value).toBe(
      mockFormikInfo.measurementPeriodEnd
    );

    const submitButton = await findByTestId("continue-button");
    await waitFor(() => expect(submitButton).not.toBeDisabled(), {
      timeout: 5000,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled(),
        {
          timeout: 5000,
        };
    });
    await waitFor(() => {
      expect(queryByTestId("server-error-alerts")).toBeInTheDocument();
    });
    expect(getByTestId("close-error-button")).toBeInTheDocument();
    fireEvent.click(getByTestId("close-error-button"));
    await waitFor(() => {
      expect(queryByTestId("server-error-alerts")).not.toBeInTheDocument();
    });
  }, 20000);

  // same values as above aside from error.
  test("our submission fails with an error class error message", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "server error:",
          validationErrors: ["error 1", "error 2"],
        },
      },
    });
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <PageHeader />
        </MemoryRouter>
      );
      const dialogButton = await findByTestId("create-new-measure-button");
      expect(queryByTestId("dialog-form")).not.toBeInTheDocument();
      expect(dialogButton).toBeTruthy();
      fireEvent.click(dialogButton);
      // we gotta hit the input to change the value of material ui components. make sure they have ids
      const nameNode = await getByTestId("measure-name-input");
      userEvent.type(nameNode, mockFormikInfo.measureName);
      expect(nameNode.value).toBe(mockFormikInfo.measureName);
      Simulate.change(nameNode);

      fireEvent.click(getByTestId("measure-name-text-field"));
      fireEvent.blur(getByTestId("measure-name-text-field"));

      const libraryNode = await getByTestId("cql-library-name-input");
      userEvent.type(libraryNode, mockFormikInfo.cqlLibraryName);
      expect(libraryNode.value).toBe(mockFormikInfo.cqlLibraryName);
      Simulate.change(libraryNode);

      const ecqmNode = await getByTestId("ecqm-input");
      userEvent.type(ecqmNode, mockFormikInfo.ecqmTitle);
      expect(ecqmNode.value).toBe(mockFormikInfo.ecqmTitle);
      Simulate.change(ecqmNode);

      const modelSelect = await getByTestId("measure-model-select");
      fireEvent.click(modelSelect);
      const modelNode = await getByTestId("measure-model-input");
      fireEvent.select(modelNode, { target: { value: mockFormikInfo.model } });
      expect(modelNode.value).toBe(mockFormikInfo.model);
      Simulate.change(modelNode);

      const measurementPeriodStartNode = getByTestId(
        "measurement-period-start"
      );
      const measurementPeriodStartInput = within(
        measurementPeriodStartNode
      ).getByRole("textbox");
      userEvent.type(
        measurementPeriodStartInput,
        mockFormikInfo.measurementPeriodStart
      );
      expect(measurementPeriodStartInput.value).toBe(
        mockFormikInfo.measurementPeriodStart
      );
      const measurementPeriodEndNode = getByTestId("measurement-period-end");
      const measurementPeriodEndInput = within(
        measurementPeriodEndNode
      ).getByRole("textbox");
      userEvent.type(
        measurementPeriodEndInput,
        mockFormikInfo.measurementPeriodEnd
      );
      expect(measurementPeriodEndInput.value).toBe(
        mockFormikInfo.measurementPeriodEnd
      );
      const submitButton = await findByTestId("continue-button");
      await waitFor(() => expect(submitButton).not.toBeDisabled(), {
        timeout: 5000,
      });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalled(),
          {
            timeout: 5000,
          };
      });
      await waitFor(() => {
        expect(queryByTestId("server-error-alerts")).toBeInTheDocument();
      });
    });
  }, 20000);

  test("We can open and close the form from measures", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/measures",
            search: "",
            hash: "",
            state: undefined,
            key: "1fewtg",
          },
        ]}
      >
        <PageHeader />
      </MemoryRouter>
    );
    const dialogButton = await findByTestId("create-new-measure-button");
    expect(dialogButton).toBeTruthy();
    fireEvent.click(dialogButton);
    const dialog = await findByTestId("dialog-form");
    expect(dialog).toBeTruthy();
    const closeButton = await findByTestId("close-button");
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(queryByTestId("close-button")).not.toBeInTheDocument();
    });
  });

  test("On measure edit page measureState is updated and links are rendered, ", async () => {
    jest.mock("@madie/madie-util", () => ({
      getServiceConfig: () => ({
        measureService: {
          baseUrl: "example-service-url",
        },
      }),
      measureStore: {
        state: mockFormikInfo,
        initialState: mockFormikInfo,
        subscribe: (set) => {
          set(mockFormikInfo);
          return { unsubscribe: () => null };
        },
        unsubscribe: () => null,
      },
      useOktaTokens: () => ({
        getAccessToken: () => "test.jwt",
        getUserName: () => "test", //#nosec
      }),
    }));

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/measures/62a7ab0e4fb904343c4f1f79/edit/details",
            search: "",
            hash: "",
            state: undefined,
            key: "1fewtg",
          },
        ]}
      >
        <PageHeader />
      </MemoryRouter>
    );
    expect(queryByTestId("info-Active-0")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(queryByTestId("info-QI-Core v4.1.1-0")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(queryByTestId("info-1/5/2022 - 3/7/2022-1")).toBeInTheDocument()
    );
  });
});
