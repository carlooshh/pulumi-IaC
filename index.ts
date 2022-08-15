import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("hello-pulumi");

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount("sa", {
  resourceGroupName: resourceGroup.name,
  sku: {
    name: storage.SkuName.Standard_LRS,
  },
  kind: storage.Kind.StorageV2,
});

// Export the primary key of the Storage Account
const storageAccountKeys = pulumi
  .all([resourceGroup.name, storageAccount.name])
  .apply(([resourceGroupName, accountName]) =>
    storage.listStorageAccountKeys({ resourceGroupName, accountName })
  );
export const primaryStorageKey = storageAccountKeys.keys[0].value;

// Enable static website support
const staticWebsite = new storage.StorageAccountStaticWebsite("staticWebsite", {
  accountName: storageAccount.name,
  resourceGroupName: resourceGroup.name,
  indexDocument: "index.html",
});

// Upload the file
const indexHtml = new storage.Blob("index.html", {
  resourceGroupName: resourceGroup.name,
  accountName: storageAccount.name,
  containerName: staticWebsite.containerName,
  source: new pulumi.asset.FileAsset("index.html"),
  contentType: "text/html",
});

// Web endpoint to the website
export const staticEndpoint = storageAccount.primaryEndpoints.web;
