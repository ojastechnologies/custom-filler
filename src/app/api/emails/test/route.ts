import { NextResponse } from 'next/server';
import { azureEmailConfig, validateAzureConfig } from '@/config/azure';

export async function GET() {
  try {
    console.log('Testing Azure email configuration...');
    
    const configValid = validateAzureConfig();
    
    const configCheck = {
      hasConnectionString: !!azureEmailConfig.connectionString,
      hasFromEmail: !!azureEmailConfig.fromEmail,
      hasAdminEmail: !!azureEmailConfig.adminEmail,
      connectionStringFormat: azureEmailConfig.connectionString ? 
        (azureEmailConfig.connectionString.includes('endpoint=') && azureEmailConfig.connectionString.includes('accesskey=')) : false,
      configValid,
      fromEmail: azureEmailConfig.fromEmail || 'NOT_SET',
      adminEmail: azureEmailConfig.adminEmail || 'NOT_SET',
      connectionStringLength: azureEmailConfig.connectionString ? 
        azureEmailConfig.connectionString.length : 0
    };

    console.log('Configuration check:', configCheck);

    return NextResponse.json({
      success: true,
      config: configCheck,
      message: configValid ? 'Configuration looks good' : 'Configuration has issues'
    });

  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}