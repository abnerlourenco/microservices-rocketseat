import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker-build"

const  ordersECRRepository = new awsx.ecr.Repository('orders-ecr', {
  forceDelete: true,
})

const ordersECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ordersECRRepository.repository.registryId,
})

const ordersDockerImage = new docker.Image('orders-image', {
  tags: [
    pulumi.interpolate`${ordersECRRepository.repository.repositoryUrl}:latest`,
  ], // Tag for the image version in the repository
  context: {
    location: '../app-orders', // Path to your Dockerfile
  },
  push: true, // Push the image to the registry to repository
  platforms: [
    'linux/amd64', // Specify the platform if needed
  ],
  registries: [
    { 
      address: ordersECRRepository.repository.repositoryUrl, // ECR registry URL to push image
      username: ordersECRToken.userName,
      password: ordersECRToken.password,
    }
  ]
})

const cluster = new awsx.classic.ecs.Cluster('orders-cluster-app');

const ordersService = new awsx.classic.ecs.FargateService('fargate-orders', {
  cluster, // Reference to the ECS cluster
  desiredCount: 1, // Number of instances running
  waitForSteadyState: false, // Do not wait for steady state
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256,
      memory: 512,
    },
  },
})