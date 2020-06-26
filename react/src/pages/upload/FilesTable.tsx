import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import MaterialTable, { MTableToolbar } from 'material-table';

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    }
}));

function createFile(name: string, uploader: string, size: number, md5: string, created: string) {
    return { name, uploader, size, md5, created };
}

const rows = [
    createFile('1900_4312A_R1.fastq.gz', 'CHEO', 102400, '3a72eed94ddd4fafff9e4c2ba88cae02', '2020-02-01'),
    createFile('1900_4312A_R2.fastq.gz', 'CHEO', 102400, '7894a2a8b3944340f5e1c1120eeeb621', '2020-02-01'),
    createFile('1200_12443.bam', 'ACH', 102400, 'ba27a3fc4777369dc8a183fa42d5169e', '2020-02-01'),
    createFile('930_02000.sam', 'ACH', 102400, 'd6d43f22fa0417850cb94b7cbfd1a25c', '2020-02-01'),
    createFile('1024_2048B.cram', 'SK', 132233134, '2edcbb4ea21b500e2eb1ae81f310d0c1', '2020-02-01'),
    createFile('2048_2048B.cram', 'BTS', 132233134, '6a413de1dc394de5384d300041922848', '2020-02-01'),
];

export default function FilesTable() {
    const classes = useStyles();

    return (
        <MaterialTable
            columns={[
                { title: 'File name', field: 'name' },
                { title: 'Uploader', field: 'uploader' },
                { title: 'Size (mb)', field: 'size', type: 'numeric' },
                { title: 'MD5sum', field: 'md5', type: 'string' },
                { title: 'Created', field: 'created', type: 'string' }
            ]}
            data={rows}
            title="Unlinked files"
            options={{
                pageSize: 10,
                selection: true
            }}
            components={{
                Toolbar: props => (
                    <div>
                        <MTableToolbar {...props} />
                        <div style={{ marginLeft: '24px' }}>
                            <Chip label="CHEO" clickable className={classes.chip} />
                            <Chip label="SK" clickable className={classes.chip} />
                            <Chip label="ACH" clickable className={classes.chip} />
                            <Chip label="BCL" clickable className={classes.chip} />
                            <Chip label="Misc." clickable className={classes.chip} />
                        </div>
                    </div>
                ),
            }}
        />
    )
}
