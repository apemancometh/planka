export function override(resources: any) {
  const proj = resources.apiPipelineCodeBuildProject as any;
  proj.source = proj.source || {};
  proj.source.buildSpec = `
version: 0.2
phases:
  pre_build:
    commands:
      - aws --version
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | md5sum | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Building...
      - docker build -t $planka_REPOSITORY_URI:\$IMAGE_TAG -f Dockerfile .
  post_build:
    commands:
      - docker push $planka_REPOSITORY_URI:\$IMAGE_TAG
      - printf '[{"name":"planka","imageUri":"%s"}]' "$planka_REPOSITORY_URI:\$IMAGE_TAG" > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
  `;
}
