#!/bin/bash


read -p "Are you sure: " sure

if [[ "$sure" == "yes" ]]; then
	rm -rf uploads
fi


mkdir -p uploads/agreements
mkdir -p uploads/payments/{bankSlip, bankslips,invoices}