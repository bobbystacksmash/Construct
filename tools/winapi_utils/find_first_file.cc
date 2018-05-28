#include "stdafx.h"
#include <windows.h>
#include <tchar.h>
#include <stdio.h>

void _tmain(int argc, TCHAR *argv[])
{
	WIN32_FIND_DATA FindFileData;
	HANDLE hFind;

	if (argc != 2)
	{
		_tprintf(TEXT("Usage: %s WILDCARD_EXPR\n"), argv[0]);
		return;
	}

	hFind = FindFirstFile(argv[1], &FindFileData);
	if (hFind == INVALID_HANDLE_VALUE)
	{
		printf("FindFirstFile failed (%d)\n", GetLastError());
		return;
	}
	else
	{
		_tprintf(TEXT("%s\n"), FindFileData.cFileName);
	}

	while (FindNextFile(hFind, &FindFileData)) {
		_tprintf(TEXT("%s\n"), FindFileData.cFileName);
	}

	FindClose(hFind);
}
