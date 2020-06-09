# Azure Storage Blob client library for TypeScript

These sample programs show how to use the TypeScript client libraries for Azure Storage Blobs in some common scenarios.

## Prerequisites

These samples require a Node.js >= 10.0.0.

Before running the samples in Node, they must be compiled to JavaScript using the TypeScript compiler. For more information on TypeScript, see the [TypeScript documentation][typescript]. Install the TypeScript compiler using

```bash
npm install -g typescript
```

You need [an Azure subscription][freesub] and [an Azure Storage account][azstorage] to run this  sample project. Locally, the project retrieves credentials to access the storage account from environment variables, and when deployed to Azure, it uses the MSI credentials.

## Setup

To run the project using the published version of the package:

1.Install the dependencies using `npm`:

```bash
npm install
```

2.Compile the project

```bash
npm run build
```

3.Edit the file `sample.env`, adding the correct credentials to access the Azure service. Then rename the file from `sample.env` to just `.env`. The project will read this file automatically when running locally.
>Note: Make sure the AZURE service principal has RBAC access to the storage account with `Storage Blob Data Contributor` role.

4.Run project:

```bash
npm start
```
