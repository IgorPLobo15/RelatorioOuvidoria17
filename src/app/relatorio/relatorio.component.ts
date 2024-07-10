import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio.component.html',
  styleUrl: './relatorio.component.css'
})
export class RelatorioComponent implements OnInit {
  orgaos: any[] = [];
  manifestacaoTipos: any[] = [];
  assuntos: any[]=[];
  subassuntos: any[]=[];
  tramites: any[]=[];


  constructor(private  dataServices: DataService) { }

  ngOnInit(): void {
    this.dataServices.getManifestacaoTipos().subscribe(data => {
      this.manifestacaoTipos = data;
    });
    this.dataServices.getAssuntos().subscribe(data => {
      this.assuntos = data;

    });
    this.dataServices.getSubassuntos().subscribe(data => {
      this.subassuntos= data;
    });
    this.dataServices.getTramites().subscribe(data => {
      this.tramites= data;
    });
    this.dataServices.getOrgaos().subscribe(data => {
      this.orgaos= data;
    });

  }
}