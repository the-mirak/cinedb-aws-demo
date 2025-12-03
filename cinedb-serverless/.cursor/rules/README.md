# Cursor Rules for CineDB Serverless Project

This directory contains Cursor IDE rules following the official MDC format. Due to technical issues with file creation, here's the intended structure:

## Rule Files (MDC Format)

### 1. aws-serverless.mdc
**Purpose**: AWS Serverless best practices for Lambda, DynamoDB, S3, and API Gateway
**Applies to**: `backend/**/*.py`, `sam/**/*.yaml`, `sam/**/*.yml`
**Type**: Auto-attached when working with backend or SAM files

**Key Guidelines**:
- Use Python 3.9+ runtime for Lambda functions
- Keep functions stateless and focused on single responsibilities
- Use environment variables for configuration
- Implement proper error handling with specific exception types
- Use boto3 resource and client patterns appropriately
- Use presigned URLs for secure S3 file access
- Implement proper CORS configuration
- Use AWS_PROXY integration for API Gateway
- Follow least-privilege IAM permissions

### 2. python-lambda.mdc
**Purpose**: Python coding standards for Lambda functions
**Applies to**: `backend/**/*.py`
**Type**: Always applied

**Key Guidelines**:
- Follow PEP 8 style guidelines
- Use type hints for function parameters and return values
- Use descriptive variable and function names
- Implement structured error responses
- Use os.environ.get() with default values
- Initialize AWS clients outside the handler for reuse

### 3. frontend-standards.mdc
**Purpose**: Frontend coding standards for HTML, CSS, and JavaScript
**Applies to**: `frontend/**/*.html`, `frontend/**/*.js`, `frontend/**/*.css`
**Type**: Always applied

**Key Guidelines**:
- Use ES6+ features (const, let, arrow functions, async/await)
- Use fetch() for HTTP requests with proper error handling
- Use Tailwind CSS for all styling
- Follow mobile-first responsive design
- Use semantic HTML elements
- Implement proper accessibility with ARIA labels

### 4. cinedb-workflow.mdc
**Purpose**: CineDB-specific development workflows and processes
**Applies to**: All files
**Type**: Manual (use @cinedb-workflow to invoke)

**Key Guidelines**:
- Use mock API server for frontend testing
- Test Lambda functions individually before API Gateway integration
- Follow specific deployment workflow
- Implement proper file upload handling
- Use consistent error response format
- Follow environment configuration standards

### 5. sam-infrastructure.mdc
**Purpose**: SAM template and Infrastructure as Code best practices
**Applies to**: `sam/**/*.yaml`, `sam/**/*.yml`, `**/*template*.yaml`
**Type**: Auto-attached when working with SAM templates

**Key Guidelines**:
- Use SAM CLI version 1.0+ syntax
- Organize resources by logical grouping
- Use consistent naming conventions (PascalCase for resources)
- Include proper descriptions for all resources
- Use Parameters for environment-specific values
- Configure proper CORS and binary media types
- Follow least-privilege principle for IAM roles

## Usage

These rules will automatically apply based on the file types you're working with:
- **Always Applied**: Python Lambda and Frontend standards
- **Auto-Attached**: AWS Serverless and SAM Infrastructure rules when working with relevant files
- **Manual**: CineDB Workflow rules (use @cinedb-workflow to invoke)

## Creating the Actual MDC Files

To create the actual MDC files, use the Cursor command palette:
1. Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux)
2. Type "New Cursor Rule"
3. Create each rule file with the appropriate MDC metadata header:

```
---
description: [Rule description]
globs: ["file/patterns/**/*.ext"]
alwaysApply: [true/false]
---

[Rule content here]
```

## Best Practices

- Keep rules concise (under 500 lines)
- Split large concepts into multiple, composable rules
- Provide concrete examples when helpful
- Write rules like clear internal documentation
- Reuse rules when you find yourself repeating prompts 